import { Link } from 'react-router-dom';
import '../styles/ui.css';

function Button() {
  return (
    <Link className="my-button" to="/administrator-form">
      Create Administrator
    </Link>
  );
}

export default Button;