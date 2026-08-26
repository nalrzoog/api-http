export function FullPageSpinner() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--fk-bg)',
      }}
    >
      <span className="fk-spinner fk-spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  );
}
