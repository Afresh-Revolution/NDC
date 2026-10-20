"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/app/actions/auth";
import { audit } from "@/lib/audit";
import { can, isAdmin } from "@/lib/auth";
import {
  beginPaystack,
  cancelMembership,
  choosePlan,
  reviewManualPayment,
  saveMembershipSettings,
  scheduleFrequency,
  setMembershipSuspended,
  submitManualPayment,
} from "@/lib/membership";
import { parseNairaInput } from "@/lib/money";
import type { Frequency, PlanClass } from "@/lib/membership-calc";

function fail(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function planOf(value: FormDataEntryValue | null): PlanClass {
  return value === "associate" ? "associate" : "professional";
}

function frequencyOf(value: FormDataEntryValue | null): Frequency {
  return value === "yearly" ? "yearly" : "monthly";
}

export async function chooseMembershipPlan(formData: FormData) {
  const user = await requireUser();
  try {
    await choosePlan(user.id, planOf(formData.get("plan")), frequencyOf(formData.get("frequency")));
    await audit({ actorId: user.id, action: "membership.plan", entity: "membership_subscriptions", entityId: user.id });
  } catch (error) {
    fail("/workspace/membership", error);
  }
  redirect("/workspace/membership");
}

export async function changeMembershipFrequency(formData: FormData) {
  const user = await requireUser();
  try {
    await scheduleFrequency(user.id, frequencyOf(formData.get("frequency")));
  } catch (error) {
    fail("/workspace/membership", error);
  }
  redirect("/workspace/membership");
}

export async function cancelMembershipAction() {
  const user = await requireUser();
  try {
    await cancelMembership(user.id);
    await audit({ actorId: user.id, action: "membership.cancel", entity: "membership_subscriptions", entityId: user.id });
  } catch (error) {
    fail("/workspace/membership", error);
  }
  redirect("/workspace/membership");
}

export async function payMembershipWithPaystack() {
  const user = await requireUser();
  try {
    const url = await beginPaystack(user.id, user.email);
    redirect(url);
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    fail("/workspace/membership", error);
  }
}

export async function submitManualMembershipPayment(formData: FormData) {
  const user = await requireUser();
  try {
    await submitManualPayment(user.id, String(formData.get("reference") ?? ""));
    await audit({ actorId: user.id, action: "membership.manual_submit", entity: "manual_payments", entityId: user.id });
  } catch (error) {
    fail("/workspace/membership", error);
  }
  redirect("/workspace/membership?notice=submitted");
}

async function editor() {
  const user = await requireUser();
  if (!isAdmin(user) && !can(user, "members.verify")) redirect("/admin");
  return user;
}

export async function saveMembershipAdminSettings(formData: FormData) {
  const user = await editor();
  try {
    await saveMembershipSettings({
      professionalMonthly: parseNairaInput(String(formData.get("professionalMonthly") ?? "")),
      professionalYearly: parseNairaInput(String(formData.get("professionalYearly") ?? "")),
      associateMonthly: parseNairaInput(String(formData.get("associateMonthly") ?? "")),
      associateYearly: parseNairaInput(String(formData.get("associateYearly") ?? "")),
      registration: parseNairaInput(String(formData.get("registration") ?? "")),
      graceDays: Math.max(0, Number(formData.get("graceDays") ?? 7) || 0),
      bankName: String(formData.get("bankName") ?? "").trim(),
      accountName: String(formData.get("accountName") ?? "").trim(),
      accountNumber: String(formData.get("accountNumber") ?? "").replace(/\s+/g, ""),
      notifyEmail: String(formData.get("notifyEmail") ?? "").trim() || "williambosworth777@icloud.com",
    });
    await audit({ actorId: user.id, action: "membership.settings", entity: "membership_settings" });
  } catch (error) {
    fail("/admin/membership", error);
  }
  redirect("/admin/membership?notice=saved");
}

export async function reviewManualMembershipPayment(formData: FormData) {
  const user = await editor();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approve" && decision !== "reject") {
    fail("/admin/membership", new Error("Choose approve or reject."));
  }
  const approve = decision === "approve";
  try {
    await reviewManualPayment(user.id, id, approve);
    await audit({
      actorId: user.id,
      action: approve ? "membership.manual_approve" : "membership.manual_reject",
      entity: "manual_payments",
      entityId: id,
    });
  } catch (error) {
    fail("/admin/membership", error);
  }
  redirect("/admin/membership");
}

export async function suspendMembershipAction(formData: FormData) {
  const user = await editor();
  const memberId = String(formData.get("userId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "suspend" && decision !== "restore") {
    fail("/admin/membership", new Error("Choose suspend or restore."));
  }
  await setMembershipSuspended(memberId, decision === "suspend");
  redirect("/admin/membership");
}
