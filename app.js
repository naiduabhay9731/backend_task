const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const axios = require("axios");
const cors = require("cors");
require('dotenv').config(); 
app.use(cors());
const apiurl = process.env.CURL;
const secret_key= process.env.SECRET_KEY;



app.get("/api/blog-stats", async (req, res) => {
  try {
    const curlRequest = await axios.get(
      apiurl,
      {
        headers: {
          "x-hasura-admin-secret":
            secret_key,
        },
      }
    );

    const blogData = curlRequest.data;
    if (!blogData || !blogData.blogs || !Array.isArray(blogData.blogs)) {
      throw new Error("Invalid blog data received from the external API.");
    }

    const totalBlogs = _.size(blogData.blogs);

    const blogLT = _.maxBy(blogData.blogs, (blog) => blog.title.length);

    const blogsPT = _.filter(blogData.blogs, (blog) =>
      _.includes(blog.title.toLowerCase(), "privacy")
    );

    const lnPT = blogsPT.length;

    const uniBT = _.uniqBy(blogData.blogs, "title").map((blog) => blog.title);

    const result = {
      total: totalBlogs,
      longest: blogLT,
      privacy_no: lnPT,
      unique_title: uniBT,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching blog data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching blog data2" });
  }
});


const search_req= async (query)=>{
    try {
        const call = await axios.get(
          apiurl,
          {
            headers: {
              "x-hasura-admin-secret":
                secret_key,
            },
          }
        );
    
        
    
        if (!query) {
          throw new Error('Query parameter "query" is required.');
        }
    
        const blogData = call.data;
    
        const filterB = _.filter(blogData.blogs, (blog) =>
          _.includes(blog.title.toLowerCase(), query.toLowerCase())
        );
        if (filterB.length === 0) {
          throw new Error("No blogs found matching the query.");
        }
    
       return filterB;
      } catch (error) {
        console.error("Error fetching blog data:", error);
        throw error;
      }
}

const memSearch = _.memoize(search_req, (query) => query, 600000);

app.get("/api/blog-search", async (req, res) => {
  const query = req.query.query;
  try {
    if (!query) {
      throw new Error('Query parameter "query" is required.');
    }

   
    const filteredBlogs = await memSearch(query);

    res.json(filteredBlogs);
  } catch (error) {
    res
      console.log("Error fetching or processing blog data:", error);
      res.status(500).json({ error: "An error occurred while fetching or processing blog data", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;

// Middleware and routes will be added here.

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
