import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import styles from '../styles/CategorySelector.module.css';

const CATEGORIES = [
  'style',
  'fashion',
  'food',
  'culture',
  'travel',
  'coding'
];

const CategorySelector = ({
  selectedCategory,
  onCategorySelect
}) => {
  const [showCategories, setShowCategories] = useState(false);

  return (
    <div className={styles.categoryDropdown}>
      <div 
        className={styles.categorySelector} 
        onClick={() => setShowCategories(!showCategories)}
      >
        <span>{selectedCategory || "Select category"}</span>
        <FaChevronDown />
      </div>
      
      {showCategories && (
        <div className={styles.categoriesList}>
          {CATEGORIES.map((category) => (
            <div 
              key={category}
              className={`${styles.categoryOption} ${selectedCategory === category ? styles.selected : ""}`}
              onClick={() => {
                onCategorySelect(category);
                setShowCategories(false);
              }}
            >
              {category}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategorySelector; 