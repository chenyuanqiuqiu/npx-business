import request from "./request";

export const getImage = (data) => {
  return request(`https://api.uomg.com/api/rand.img1`, { method: "GET", data });
};
