import React from 'react';

function TextInput(props) {
  const {
    value, name, title, onChange, error,
  } = props;
  const outerClass = [
    'mdl-textfield mdl-js-textfield mdl-textfield--floating-label',
    // Somehow MDL doesn't detect the value while switching between stories.
    // So add is-dirty class manually.
    value ? 'is-dirty' : '',
    error ? 'is-invalid' : '',
  ].join(' ');
  return (
    <div className={outerClass}>
      <input className="mdl-textfield__input"
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
  const { width = 12, children } = props;
  return (<div className={`mdl-cell mdl-cell--${width}-col`}>{children}</div>);
}

export { TextInput, Grid, GridCell };
