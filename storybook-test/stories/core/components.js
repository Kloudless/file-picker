import React from 'react';

function TextArea(props) {
  const {
    value, name, title, onChange, error,
  } = props;
  const outerClass = [
    'mdl-textfield mdl-textfield--floating-label',
    // Somehow MDL doesn't detect the value while switching between stories.
    // So add is-dirty class manually.
    value ? 'is-dirty' : '',
    error ? 'is-invalid' : '',
  ].join(' ');
  return (
    <div className={outerClass} style={{ width: '100%' }}>
      <textarea
        className="mdl-textfield__input"
        style={error && {}}
        type="text" rows="20"
        name={name} value={value} id={name}
        onChange={e => onChange(name, e)} />
      <label className="mdl-textfield__label" htmlFor={name}>{title}</label>
      {error && <span className="mdl-textfield__error">{error}</span>}
    </div>
  );
}


function TextInput(props) {
  const {
    value, name, title, onChange, error, type = 'text',
  } = props;
  const outerClass = [
    'mdl-textfield mdl-textfield--floating-label',
    // Somehow MDL doesn't detect the value while switching between stories.
    // So add is-dirty class manually.
    value ? 'is-dirty' : '',
    error ? 'is-invalid' : '',
  ].join(' ');
  return (
    <div className={outerClass} style={{ width: '100%' }}>
      <input className="mdl-textfield__input"
        type={type}
        name={name} value={value} id={name}
        onChange={e => onChange(name, e)} />
      <label className="mdl-textfield__label" htmlFor={name}>{title}</label>
      {error && <span className="mdl-textfield__error">{error}</span>}
    </div>
  );
}

function Grid(props) {
  return (<div className="mdl-grid">{props.children}</div>);
}

function GridCell(props) {
  const { children } = props;
  return (
    <div style={{ width: '600px', maxWidth: '100%' }} className="mdl-cell">
      {children}
    </div>
  );
}

export {
  TextInput, Grid, GridCell, TextArea,
};
