import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ children, className = '', variant = 'default', ...props }) => {
    const borderClass = variant === 'primary' ? 'pixel-border--primary' :
        variant === 'secondary' ? 'pixel-border--secondary' : '';

    return (
        <div className={`pixel-border ${borderClass} ${className}`} style={{ padding: '20px' }} {...props}>
            {children}
        </div>
    );
};

Card.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'primary', 'secondary']),
};

export default Card;
