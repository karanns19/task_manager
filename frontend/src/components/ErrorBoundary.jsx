import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null,
            errorId: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console and any error reporting service
        console.error('Error caught by boundary:', error, errorInfo);
        
        // Generate a unique error ID for tracking
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.setState({
            error,
            errorInfo,
            errorId
        });

        // In production, you would send this to an error reporting service
        // Example: Sentry.captureException(error, { extra: errorInfo });
        
        // Log additional context
        console.group('Error Boundary Details');
        console.log('Error ID:', errorId);
        console.log('Error:', error);
        console.log('Error Info:', errorInfo);
        console.log('Component Stack:', errorInfo.componentStack);
        console.log('User Agent:', navigator.userAgent);
        console.log('URL:', window.location.href);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReportError = () => {
        // In production, this would open a form or redirect to error reporting
        const errorReport = {
            errorId: this.state.errorId,
            error: this.state.error?.toString(),
            errorInfo: this.state.errorInfo,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        console.log('Error Report:', errorReport);
        
        // You could send this to your backend or error reporting service
        // Example: fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
        
        alert('Error has been logged. Please contact support if this issue persists.');
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                            </svg>
                        </div>
                        
                        <h1>Something went wrong</h1>
                        <p>We're sorry, but something unexpected happened. Our team has been notified.</p>
                        
                        {this.state.errorId && (
                            <div className="error-id">
                                Error ID: <code>{this.state.errorId}</code>
                            </div>
                        )}
                        
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-details">
                                <summary>Error Details (Development)</summary>
                                <div className="error-stack">
                                    <h4>Error:</h4>
                                    <pre>{this.state.error.toString()}</pre>
                                    
                                    {this.state.errorInfo && this.state.errorInfo.componentStack && (
                                        <>
                                            <h4>Component Stack:</h4>
                                            <pre>{this.state.errorInfo.componentStack}</pre>
                                        </>
                                    )}
                                </div>
                            </details>
                        )}
                        
                        <div className="error-actions">
                            <button 
                                className="btn btn-primary" 
                                onClick={this.handleReload}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 4v6h6"/>
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                </svg>
                                Reload Page
                            </button>
                            
                            <button 
                                className="btn btn-secondary" 
                                onClick={this.handleGoHome}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                                Go Home
                            </button>
                            
                            <button 
                                className="btn btn-outline" 
                                onClick={this.handleReportError}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                Report Issue
                            </button>
                        </div>
                        
                        <div className="error-help">
                            <p>If this problem continues, please:</p>
                            <ul>
                                <li>Check your internet connection</li>
                                <li>Try refreshing the page</li>
                                <li>Clear your browser cache</li>
                                <li>Contact support with the Error ID above</li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
