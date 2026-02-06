import React from 'react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'text-[16px]',
        md: 'text-[28px]',
        lg: 'text-[48px]'
    };

    return (
        <div className={`spinner ${sizeClasses[size]} ${className}`}>
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
            <div className="spinner-blade" />
        </div>
    );
};

export default Loader;
