# GisAlgorithmCourseOne

## Background
A system including many GIS functions, like buffer analysis, vector-raster conversion, and users can try many GIS algorithm on it such as Douglas-Peuker, quardtree, rtree, delaunay-voronoi. My job is to complete all the algorithms using Typescript/Javascript. 

I optimized the system by Model-View-ViewModel mode and separated it by 3 module, namely Map(map and interaction), Json(handling and managing Geojson files) and Attribute(responsible for Geojson files’ attributes data), in this way putting data and logic handling apart, thus reducing the system’ s coupling. I used JSON.stringify to read shapefile files and beautify library reshape the data and construct an object called geojson with common-used attributes, thus made it more convenient to get related data or attributes. 

## Demo
![draw](demoimgs/draw.png)

![symbols](demoimgs/symbols.png)

![matrix](demoimgs/matrix.png)

![quadtree](demoimgs/quadtree.png)

![turf](demoimgs/turf.png)

