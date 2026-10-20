import styles from "./CodePane.module.scss";

export function CodePane() {
  return (
    <div className={styles.pane} aria-hidden>
      <div className={styles.chrome}>
        <span />
        <span />
        <span />
        <em>ledger.ts</em>
      </div>
      <pre>
        <code>
          <span className={styles.kw}>if</span> (claim.pool !== <span className={styles.str}>"member_savings"</span>) {"{"}
          {"\n"}  <span className={styles.fn}>throw</span> <span className={styles.str}>"wrong pool"</span>
          {"\n"}
          {"}"}
          {"\n"}
          <span className={styles.kw}>await</span> ledger.<span className={styles.fn}>post</span>({"{"}
          {"\n"}  debit: <span className={styles.num}>2100</span>, credit: <span className={styles.num}>1100</span>
          {"\n"}{"}"})
        </code>
      </pre>
    </div>
  );
}
