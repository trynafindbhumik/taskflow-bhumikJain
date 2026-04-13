import { Navbar } from '@/components/elements/navbar/Navbar';

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
