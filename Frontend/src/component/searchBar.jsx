function SearchBar({ placeholder = 'Search', value, onChange }) {
  return (
    <label className="search-bar" aria-label="Search">
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

export default SearchBar;
