interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return <div className="flex-1 space-y-6 p-6 overflow-auto">{children}</div>;
}
