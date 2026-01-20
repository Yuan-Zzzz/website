import React from 'react';
import PropTypes from 'prop-types';

const Container = ({ children, className = '', ...props }) => {
    return (
        <div className={`container ${className}`} {...props}>
            {children}
        </div>
    );
};

Container.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

export default Container;
