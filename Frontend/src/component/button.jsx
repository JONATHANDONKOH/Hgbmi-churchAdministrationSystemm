import '../styles/ui.css';

export function Create({ onClick, type = 'button', label = 'Create' }) {
  return (
    <button type={type} className="my-button" onClick={onClick}>
      {label}
    </button>
  );
}

export default Create;