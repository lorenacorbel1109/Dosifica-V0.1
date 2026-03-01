import styles from './Button.module.css';

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  children,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={[
        styles.button,
        styles[size] || styles.md,
        styles[variant] || styles.primary,
        isDisabled ? styles.disabled : '',
        className,
      ].join(' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
};

export default Button;
