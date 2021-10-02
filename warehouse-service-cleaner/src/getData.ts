import http, {RequestOptions} from "http";

const getData = <SuccessType>(options: RequestOptions, onResult: Function) => {
  let output = "";

  const req = http.request(options, (res) => {
    res.setEncoding("utf8");

    res.on("data", (chunk) => {
      output += chunk;
    });

    res.on("end", () => {
      if (res.statusCode === 404) return onResult(null);
      let obj: any;
      try {
        obj = JSON.parse(output);
      } catch (ex) {
        return onResult(undefined);
      }
      onResult(obj as SuccessType);
    });
  });

  // req.on('error', (err) => {
  //     // res.send('error: ' + err.message);
  // });
  req.end();
};

export default getData;