import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false 
}) => {
  const sizeMap = {
    sm: { spinner: 16, text: 12 },
    md: { spinner: 24, text: 14 },
    lg: { spinner: 32, text: 16 }
  };

  const currentSize = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    ...(fullScreen ? {
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      zIndex: 1000
    } : {
      padding: '20px'
    })
  };

  const spinnerStyle: React.CSSProperties = {
    width: `${currentSize.spinner}px`,
    height: `${currentSize.spinner}px`,
    border: '2px solid #374151',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={containerStyle}>
        <div style={spinnerStyle}></div>
        <span style={{
          color: '#9ca3af',
          fontSize: `${currentSize.text}px`,
          fontWeight: '500'
        }}>
          {message}
        </span>
      </div>
    </>
  );
};

export default Loading;
