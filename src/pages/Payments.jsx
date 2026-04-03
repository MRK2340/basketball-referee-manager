import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Calendar,
  Download,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Payments = () => {
  // Hooks at the top
  const { payments, games } = useData();
  const [filter, setFilter] = useState('all');

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0);
  const thisMonthEarnings = payments.filter(p => {
    const paymentDate = new Date(p.date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  }).reduce((sum, payment) => sum + payment.amount, 0);

  const stats = [
    {
      title: 'Total Earnings',
      value: `$${totalEarnings}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Paid Amount',
      value: `$${paidAmount}`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pending',
      value: `$${pendingAmount}`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'This Month',
      value: `$${thisMonthEarnings}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Payments - Basketball Referee Manager</title>
        <meta name="description" content="Track your referee payments, earnings, and payment history for basketball games." />
      </Helmet>

      <div className="space-y-8" data-testid="payments-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
          data-testid="payments-page-header"
        >
          <div>
            <p className="app-kicker mb-3">Finance</p>
            <h1 className="app-heading mb-3 text-4xl text-slate-950">Payment Center</h1>
            <p className="max-w-2xl text-slate-600">Track earnings, review payment status, and keep your referee income organized.</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              data-testid="payments-export-button"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              onClick={() => handleFeatureClick('export-payments')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              className="basketball-gradient hover:opacity-90 text-white"
              data-testid="payments-settings-button"
              onClick={() => handleFeatureClick('payment-settings')}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Settings
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-effect border-slate-200 shadow-sm" data-testid={`payments-stat-${stat.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                        <p className="text-slate-900 text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-effect border-slate-200 shadow-sm" data-testid="payments-filter-card">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Payments' },
                  { key: 'paid', label: 'Paid' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'failed', label: 'Failed' }
                ].map((filterOption) => (
                  <Button
                    key={filterOption.key}
                    data-testid={`payments-filter-${filterOption.key}-button`}
                    variant={filter === filterOption.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(filterOption.key)}
                    className={filter === filterOption.key 
                      ? 'basketball-gradient hover:opacity-90 text-white' 
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }
                  >
                    {filterOption.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment, index) => {
              const game = games.find(g => g.id === payment.gameId);
              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 4) }}
                >
                  <Card className="glass-effect border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-sm" data-testid={`payment-row-${payment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-bold text-slate-900">
                              {game ? `${game.homeTeam} vs ${game.awayTeam}` : 'Game Payment'}
                            </h3>
                            <Badge className={`border ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Calendar className="h-4 w-4 text-brand-blue" />
                              <span>{payment.date}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <CreditCard className="h-4 w-4 text-green-600" />
                              <span>{payment.method}</span>
                            </div>
                            {game && (
                              <div className="flex items-center space-x-2 text-slate-700">
                                <span className="text-slate-500 font-medium">Division:</span>
                                <span>{game.division}</span>
                              </div>
                            )}
                          </div>

                          {payment.status === 'pending' && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <p className="text-yellow-700 text-sm font-medium">
                                  Payment processing - Expected within 2-3 business days
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end space-y-3 lg:ml-6">
                          <div className="text-right">
                            <p className="text-3xl font-bold text-green-600">${payment.amount}</p>
                            <p className="text-slate-500 text-sm font-medium">Payment Amount</p>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              data-testid={`payment-view-receipt-${payment.id}`}
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              onClick={() => handleFeatureClick('view-receipt')}
                            >
                              View Receipt
                            </Button>
                            {payment.status === 'paid' && (
                              <Button 
                                size="sm"
                                data-testid={`payment-download-receipt-${payment.id}`}
                                className="basketball-gradient hover:opacity-90 text-white"
                                onClick={() => handleFeatureClick('download-receipt')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-effect border-slate-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <DollarSign className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payments Found</h3>
                  <p className="text-slate-600 mb-6">
                    {filter !== 'all' 
                      ? `No ${filter} payments to display.`
                      : 'No payment history available yet.'}
                  </p>
                  <Button 
                    className="basketball-gradient hover:opacity-90 text-white"
                    data-testid="payments-help-button"
                    onClick={() => handleFeatureClick('payment-help')}
                  >
                    Payment Help & FAQ
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-effect border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Payment Summary</CardTitle>
              <CardDescription className="text-slate-600">
                Your earnings breakdown and payment information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-slate-900 font-semibold">Earnings Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-600 font-medium">Games Completed</span>
                      <span className="text-slate-900 font-bold">{payments.filter(p => p.status === 'paid').length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-600 font-medium">Average per Game</span>
                      <span className="text-slate-900 font-bold">
                        ${payments.length > 0 ? Math.round(totalEarnings / payments.length) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-slate-600 font-medium">Highest Payment</span>
                      <span className="text-slate-900 font-bold">
                        ${Math.max(...payments.map(p => p.amount), 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-slate-900 font-semibold">Payment Methods</h4>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      data-testid="payments-setup-direct-deposit-button"
                      className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => handleFeatureClick('setup-direct-deposit')}
                    >
                      <CreditCard className="h-4 w-4 mr-2 text-brand-blue" />
                      Setup Direct Deposit
                    </Button>
                    <Button 
                      variant="outline" 
                      data-testid="payments-update-payment-info-button"
                      className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => handleFeatureClick('update-payment-info')}
                    >
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      Update Payment Info
                    </Button>
                    <Button 
                      variant="outline" 
                      data-testid="payments-tax-documents-button"
                      className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                      onClick={() => handleFeatureClick('tax-documents')}
                    >
                      <Download className="h-4 w-4 mr-2 text-brand-orange" />
                      Tax Documents
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Payments;