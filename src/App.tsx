/**
 * SISTEM INFORMASI PEMBAYARAN SPP & UANG TAHUNAN
 * SMP ALAM EXCELLENTIA PAMEKASAN - YAYASAN INSAN KAMIL
 * T.A. 2026/2027
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { PaymentView } from './components/PaymentView';
import { AnnualFeeView } from './components/AnnualFeeView';
import { RekapMatrixView } from './components/RekapMatrixView';
import { ArrearsReminderView } from './components/ArrearsReminderView';
import { BillingConfigView } from './components/BillingConfigView';
import { ReportsView } from './components/ReportsView';
import { AuditAndBackupView } from './components/AuditAndBackupView';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginModal } from './components/LoginModal';
import { Student, Transaction, AnnualFeePayment } from './types';

const MainContent: React.FC = () => {
  const { currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [quickPayStudent, setQuickPayStudent] = useState<Student | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | AnnualFeePayment | null>(null);

  // Navigate to payment with preselected student
  const handleQuickPayForStudent = (student: Student) => {
    setQuickPayStudent(student);
    setActiveTab('payment');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        setIsOpenMobile={setIsMobileMenuOpen}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-72">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenQuickPayment={() => {
            setQuickPayStudent(null);
            setActiveTab('payment');
          }}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToPayment={() => {
                setQuickPayStudent(null);
                setActiveTab('payment');
              }}
              onNavigateToArrears={() => setActiveTab('arrears')}
              onNavigateToReports={() => setActiveTab('reports')}
              onShowReceipt={(trx) => setActiveReceipt(trx)}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentView
              preselectedStudent={quickPayStudent}
              onShowReceipt={(trx) => setActiveReceipt(trx)}
            />
          )}

          {activeTab === 'annual' && (
            <AnnualFeeView
              onShowReceipt={(payment) => setActiveReceipt(payment)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView onQuickPayForStudent={handleQuickPayForStudent} />
          )}

          {activeTab === 'rekap' && (
            <RekapMatrixView onQuickPayForStudent={handleQuickPayForStudent} />
          )}

          {activeTab === 'arrears' && (
            <ArrearsReminderView onQuickPayForStudent={handleQuickPayForStudent} />
          )}

          {activeTab === 'tariffs' && <BillingConfigView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'audit' && <AuditAndBackupView />}
        </main>
      </div>

      {/* Modal Kuitansi Digital */}
      {activeReceipt && (
        <ReceiptModal
          transaction={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Modal Login Google & Email */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
