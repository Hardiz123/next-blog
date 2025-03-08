import styles from "./about.module.css";
import Image from "next/image";

const AboutPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.textContainer}>
        <div className={styles.item}>
          <h1 className={styles.title}>About Our Blog</h1>
          <h2 className={styles.subtitle}>
            A community of passionate writers and readers
          </h2>
          <p className={styles.desc}>
            Welcome to our blog, where ideas come to life and stories find their voice. 
            Founded with the vision of creating a space for meaningful conversations and 
            knowledge sharing, we&apos;ve grown into a vibrant community of writers, thinkers, 
            and curious minds.
            <br />
            <br />
            Our platform brings together diverse perspectives on technology, culture, 
            lifestyle, and more. We believe in the power of well-crafted content to 
            inspire, educate, and connect people across the globe.
          </p>
        </div>
        <div className={styles.imageContainer}>
          <Image
            src="/about.jpg"
            alt="About Us Image"
            fill
            className={styles.image}
          />
        </div>
      </div>
      <div className={styles.boxes}>
        <div className={styles.box}>
          <h1>10K+</h1>
          <p>Active Users</p>
        </div>
        <div className={styles.box}>
          <h1>500+</h1>
          <p>Published Stories</p>
        </div>
        <div className={styles.box}>
          <h1>100+</h1>
          <p>Expert Writers</p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 