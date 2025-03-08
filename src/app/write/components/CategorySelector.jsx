import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import styles from '../styles/CategorySelector.module.css';

const CATEGORIES = [
  'style',
  'fashion',
  'food',
  'travel',
  'culture',
  'coding',
  'technology',
  'business'
];

const CategorySelector = ({
  category,
  setCategory
}) => {
  const [showCategories, setShowCategories] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategories(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.categorySelector} ref={dropdownRef}>
      <label className={styles.label}>Category</label>
      <div className={styles.selectContainer}>
        <div 
          className={styles.select}
          onClick={() => setShowCategories(!showCategories)}
        >
          <span>{category || "Select category"}</span>
          <FaChevronDown className={`${styles.selectArrow} ${showCategories ? styles.open : ''}`} />
        </div>
        
        {showCategories && (
          <div className={styles.categoriesList}>
            {CATEGORIES.map((cat) => (
              <div 
                key={cat}
                className={`${styles.categoryOption} ${category === cat ? styles.selected : ""}`}
                onClick={() => {
                  setCategory(cat);
                  setShowCategories(false);
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelector; 