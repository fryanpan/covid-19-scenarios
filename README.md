# COVID-19 What-If Model

# The Model

The model implemented here is a very crude
SEIR (Susceptible, Exposed, Infected, Recovered) Model that only keeps track of counts on 
a daily basis.  It can be made more 
mathematically accurate, but I elected
to make the model accurate enough and
focus more on useful questions to answer.  


# Initial Setup

1. [Setup your Gatsby development environment](https://www.gatsbyjs.org/tutorial/part-zero/)
2. Install all packages
    ```
    npm install
    ````
3. To run the development server locally
    ```
    gatsby develop
    ```


# Refresh the Data

Data comes from the Johns Hopkins dashboard [Github repo](https://github.com/CSSEGISandData/COVID-19)

Historical data changed formats multiple times, so there is a [download_data.js](./data_download/download_data.js) script that tries to clean up
various legacy formats.

All of the data driving this site lives in the [src/data](./src/data) folder.

To refresh the data, please run this:
```
    npm run refresh_data
```
