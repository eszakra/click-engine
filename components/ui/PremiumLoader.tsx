import React from 'react';

interface PremiumLoaderProps {
    size?: number;
    className?: string;
    color?: string;
}

const PremiumLoader: React.FC<PremiumLoaderProps> = ({
    size = 24,
    className = '',
    color = 'white' // Default to white, can be overridden
}) => {
    // Generate 12 bars for the iOS spinner effect
    const bars = Array.from({ length: 12 }).map((_, i) => {
        const rotation = i * 30;
        const delay = -1.2 + (i * 0.1);
        return (
            <div
                key={i}
                style={{
                    transform: `rotate(${rotation}deg) translate(0, -140%)`,
                    animationDelay: `${delay}s`,
                    backgroundColor: color
                }}
                className="absolute top-1/2 left-1/2 w-[8%] h-[24%] -ml-[4%] -mt-[12%] rounded-full opacity-0 animate-spinner-fade"
            />
        );
    });

    return (
        <div
            className={`relative inline-block ${className}`}
            style={{ width: size, height: size }}
        >
            {bars}
            <style>{`
                @keyframes spinner-fade {
                    0% { opacity: 1; }
                    100% { opacity: 0.15; }
                }
                .animate-spinner-fade {
                    animation: spinner-fade 1.2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default PremiumLoader;
