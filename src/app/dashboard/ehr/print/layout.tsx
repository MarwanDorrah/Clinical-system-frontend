export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-layout-wrapper">
      {children}
    </div>
  );
}
