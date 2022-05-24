const parseFeed = (parsedResponse) => {
  const title = parsedResponse.querySelector('title').textContent;
  const description = parsedResponse.querySelector('description').textContent;
  return { title, description };
};

const parsePosts = (parsedResponse) => {
  const parsedPosts = parsedResponse.querySelectorAll('item');
  const posts = [];

  parsedPosts.forEach((parsedPost) => {
    const post = {
      URL: parsedPost.querySelector('link').textContent,
      title: parsedPost.querySelector('title').textContent,
      description: parsedPost.querySelector('description').textContent,
    };
    posts.push(post);
  });

  return posts;
};

export default (response) => {
  const parser = new DOMParser();
  const parsedResponse = parser.parseFromString(response.data.contents, 'text/xml');

  const parsedFeed = parseFeed(parsedResponse);
  const parsedPosts = parsePosts(parsedResponse);

  return { parsedFeed, parsedPosts };
};
