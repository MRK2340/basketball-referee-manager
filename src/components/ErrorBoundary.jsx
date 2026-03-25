import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Technical Foul!</h1>
            <p className="text-slate-600 mb-6 font-medium">
              Something went wrong on our end. We've called a timeout to fix this.
            </p>
            
            <div className="bg-slate-100 p-4 rounded-md mb-6 text-left overflow-hidden border border-slate-200">
              <p className="text-red-600 font-mono text-xs break-all font-semibold">
                {this.state.error && this.state.error.toString()}
              </p>
            </div>

            <div className="flex space-x-3 justify-center">
              <Button 
                onClick={this.handleReset}
                className="bg-brand-blue hover:bg-brand-blue-deep text-white font-bold"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleGoHome}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;