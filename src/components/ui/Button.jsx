import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const baseClass = 'pixel-btn';
    const variantClass = variant === 'secondary' ? 'pixel-btn--secondary' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    variant: PropTypes.oneOf(['primary', 'secondary']),
    className: PropTypes.string,
};

export default Button;
