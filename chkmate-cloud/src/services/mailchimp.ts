import jsonp from 'jsonp';

export const subscribeToMailchimp = (email: string, onSuccess: () => void, onError: (err: any) => void) => {
  const url = import.meta.env.VITE_MAILCHIMP_URL;
  if (!url) {
    console.warn('Mailchimp URL not found in environment variables.');
    onError('Configuration error');
    return;
  }

  // Convert the URL from /post? to /post-json? for JSONP
  const jsonpUrl = url.replace('/post?', '/post-json?');
  const params = `&EMAIL=${encodeURIComponent(email)}`;

  jsonp(`${jsonpUrl}${params}`, { param: 'c' }, (err, data) => {
    if (err) {
      onError(err);
    } else if (data.result !== 'success') {
      onError(data.msg);
    } else {
      onSuccess();
    }
  });
};
