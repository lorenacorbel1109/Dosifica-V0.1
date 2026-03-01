import { useState } from 'react';
import { useAppModeStore } from '../store/appModeStore.jsx';

const OperatorGate = () => {
  const { isProduction, operatorId, setOperatorId } = useAppModeStore();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (!isProduction || operatorId) {
    return null;
  }

  const handleSubmit = () => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      setError('Debe identificarse para usar modo producción');
      return;
    }

    setError('');
    setOperatorId(normalizedValue);
  };

  return (
    <section
      style={{
        border: '1px solid #dbe2ef',
        borderRadius: 8,
        background: '#f8fbff',
        padding: 16,
        marginBottom: 12,
        display: 'grid',
        gap: 10,
      }}
    >
      <label htmlFor="operator-id-input" style={{ fontWeight: 600 }}>
        Código de operador (DNI o código establecimiento)
      </label>
      <input
        id="operator-id-input"
        type="text"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError('');
        }}
        placeholder="Ingrese su código"
        style={{ border: '1px solid #b8c7e0', borderRadius: 6, padding: '10px 12px' }}
      />

      {error && <small style={{ color: '#b42318' }}>{error}</small>}

      <button
        type="button"
        onClick={handleSubmit}
        style={{
          justifySelf: 'start',
          border: 'none',
          borderRadius: 6,
          padding: '10px 14px',
          background: '#1f4f99',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Ingresar a modo producción
      </button>
    </section>
  );
};

export default OperatorGate;
