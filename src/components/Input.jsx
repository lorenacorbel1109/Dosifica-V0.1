import styles from './Input.module.css';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  options = [],
  error,
  success,
  helperText,
  id,
  ...props
}) => {
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const wrapperClass = [styles.wrapper, error ? styles.error : '', success ? styles.success : ''].join(' ');
  const fieldId = id || `input-${label || 'field'}`.replace(/\s+/g, '-').toLowerCase();

  const renderControl = () => {
    if (type === 'textarea') {
      return <textarea id={fieldId} className={styles.control} value={value} onChange={onChange} {...props} />;
    }

    if (type === 'select') {
      return (
        <select id={fieldId} className={styles.control} value={value} onChange={onChange} {...props}>
          <option value="">Seleccionar</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    return <input id={fieldId} type={type} className={styles.control} value={value} onChange={onChange} {...props} />;
  };

  return (
    <label className={wrapperClass} htmlFor={fieldId}>
      <div className={styles.fieldWrap}>
        {renderControl()}
        {label && <span className={[styles.floating, hasValue ? styles.floatingActive : ''].join(' ')}>{label}</span>}
      </div>
      {error ? <span className={styles.errorText}>{error}</span> : helperText ? <span className={styles.helper}>{helperText}</span> : null}
    </label>
  );
};

export default Input;
