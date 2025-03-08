import Menu from "@/components/Menu/Menu";
import styles from "./singlePage.module.css";
import Image from "next/image";
import Comments from "@/components/comments/Comments";
import PostActions from "@/components/postActions/PostActions";
import { Suspense } from 'react';
import { redirect } from "next/navigation";

const getData = async (slug) => {
  const res = await fetch(`http://localhost:3000/api/posts/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    // navigate to home page
    redirect("/");
  }

  return res.json();
};

// Loading component for the post content
const PostLoading = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingTitle}></div>
      <div className={styles.loadingUser}>
        <div className={styles.loadingAvatar}></div>
        <div className={styles.loadingUserInfo}>
          <div className={styles.loadingUsername}></div>
          <div className={styles.loadingDate}></div>
        </div>
      </div>
      <div className={styles.loadingImage}></div>
      <div className={styles.loadingContent}>
        <div className={styles.loadingLine}></div>
        <div className={styles.loadingLine}></div>
        <div className={styles.loadingLine}></div>
        <div className={styles.loadingLine}></div>
      </div>
    </div>
  );
};

// Loading component for comments
const CommentsLoading = () => {
  return (
    <div className={styles.loadingComments}>
      <div className={styles.loadingCommentsTitle}></div>
      <div className={styles.loadingCommentsForm}></div>
      <div className={styles.loadingCommentsList}>
        <div className={styles.loadingComment}></div>
        <div className={styles.loadingComment}></div>
      </div>
    </div>
  );
};

const SinglePage = async ({ params }) => {
  const { slug } = params;

  const data = await getData(slug);

  return (
    <div className={styles.container}>
      <Suspense fallback={<PostLoading />}>
        <div className={styles.infoContainer}>
          <div className={styles.textContainer}>
            <h1 className={styles.title}>{data?.title}</h1>
            <div className={styles.user}>
              {data?.user?.image && (
                <div className={styles.userImageContainer}>
                  <Image src={data.user.image} alt="" fill className={styles.avatar} />
                </div>
              )}
              <div className={styles.userTextContainer}>
                <span className={styles.username}>{data?.user.name}</span>
                <span className={styles.date}>
                  {new Date(data?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          {data?.img && (
            <div className={styles.imageContainer}>
              <Image src={data.img} alt="" fill className={styles.image} />
            </div>
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.post}>
            <div
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: data?.desc }}
            />
            <PostActions post={data} />
            <Suspense fallback={<CommentsLoading />}>
              <div className={styles.comment}>
                <Comments postSlug={slug}/>
              </div>
            </Suspense>
          </div>
          <Menu />
        </div>
      </Suspense>
    </div>
  );
};

export default SinglePage;
