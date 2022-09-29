const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (e) {
    throw {
      f: "fetchData",
      msg: "error fetching data",
      e,
    };
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // Get the data
  datasourceUrl =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";
  const dataset = await fetchData(datasourceUrl);

  //Get the svg
  const graph = d3.select(".graph");

  //Get the graph dimensions
  const width = graph.node().getBoundingClientRect().width;
  const height = graph.node().getBoundingClientRect().height;

  //Create the treemap
  const treemap = d3.treemap().size([width, height]).paddingInner(1);

  //Creating the root of the treemap
  const root = d3
    .hierarchy(dataset)
    .eachBefore((d) => {
      d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name;
    })
    .sum((d) => d.value)
    .sort((a, b) => b.height - a.height || b.value - a.value);

  //Applying the root to the treemap
  treemap(root);

  // Plot the treemap
  //Add the containers for each leaf
  const cells = graph
    .selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("class", "tile-container")
    .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);

  //Generate the fader to fade the color scheme
  const fadeColor = (color) => d3.interpolateRgb(color, "#000")(0.2);
  const originalColorScheme = [
    "#1f77b4",
    "#aec7e8",
    "#ff7f0e",
    "#ffbb78",
    "#2ca02c",
    "#98df8a",
    "#d62728",
    "#ff9896",
    "#9467bd",
    "#c5b0d5",
    "#8c564b",
    "#c49c94",
    "#e377c2",
    "#f7b6d2",
    "#7f7f7f",
    "#c7c7c7",
    "#bcbd22",
    "#dbdb8d",
    "#17becf",
    "#9edae5",
  ];

  const fadedColorScheme = originalColorScheme.map((color) => fadeColor(color));

  //Create the color scale to be used
  const generateColor = d3.scaleOrdinal(fadedColorScheme);

  //Create the squares for each leaf
  const squares = cells
    .append("rect")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => generateColor(d.parent.data.id))
    .attr("class", "tile")
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value);

  //Create the border between leaf squares
  cells.append("clipPath");

  //Add the text to each leaf square
  // https://bl.ocks.org/jensgrubert/7943555
  const cellTextContainers = cells
    .append("foreignObject")
    .attr("class", "tile-text")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  const cellTexts = cellTextContainers
    .append("xhtml:div")
    .attr("class", "label")
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .text((d) => d.data.name)
    .attr("text-anchor", "middle");

  //Creating the legend
  const legend = d3.select("#legend");

  //Get the platforms and their respective id's
  const platforms = root.children.map((child) => ({
    name: child.data.name,
    id: child.data.id,
  }));

  //Set the x and y distance between legend labels
  const xDistanceBetweenLegendLabels = 75;
  const yDistanceBetweenLegendLabels = 50;

  //Setting the number of legend labels per row of the legend
  const numberOfLegendLabelsPerRow = 6;

  //Setting the x and y legend padding
  const xLegendPadding = 10;
  const yLegendPadding = 10;

  //Setting up the legend rect size
  const legendRectSize = 20;

  //Setting up the roundness of legend rect size
  const legendRoundness = 5;

  //Plot the legend
  const legendLabelContainers = legend
    .selectAll("g")
    .data(platforms)
    .enter()
    .append("g")
    .attr(
      "transform",
      (d, i) =>
        `translate(${
          xLegendPadding +
          xDistanceBetweenLegendLabels * (i % numberOfLegendLabelsPerRow)
        }, ${
          yLegendPadding +
          yDistanceBetweenLegendLabels *
            Math.floor(i / numberOfLegendLabelsPerRow)
        } )`
    );

  legendLabelContainers
    .append("rect")
    .attr("class", "legend-item")
    .attr("width", legendRectSize)
    .attr("height", legendRectSize)
    .attr("rx", legendRoundness)
    .attr("fill", (d) => generateColor(d.id))
    .attr("x", 0)
    .attr("y", 0);

  legendLabelContainers
    .append("text")
    .text((d) => d.name)
    .attr("x", 25)
    .attr("y", 16);

  console.log(
    platforms.length % numberOfLegendLabelsPerRow === 0
      ? Math.floor(platforms.length / numberOfLegendLabelsPerRow)
      : Math.floor(platforms.length / numberOfLegendLabelsPerRow) + 1
  );

  //Set the legend width and height
  legend
    .attr(
      "width",
      xLegendPadding + numberOfLegendLabelsPerRow * xDistanceBetweenLegendLabels
    )
    .attr(
      "height",
      yLegendPadding +
        legendRectSize +
        ((platforms.length % numberOfLegendLabelsPerRow === 0 ? -1 : 0) +
          Math.floor(platforms.length / numberOfLegendLabelsPerRow)) *
          yDistanceBetweenLegendLabels
    );

  //Creating the tooltip
  const tooltip = d3
    .select(".graph-container")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
  //Creating our tooltip functions
  const mouseoverTooltip = (e) => {
    tooltip.transition().duration(150).style("opacity", 0.95);
    d3.select(e.srcElement).style("stroke", "#CAA791");
  };
  const mouseleaveTooltip = (e) => {
    tooltip.transition().duration(150).style("opacity", 0);
    d3.select(e.srcElement).style("stroke", "none");
  };

  const mousemoveTooltip = (e) => {
    //Get the element
    const elementData = d3.select(e.srcElement).data()[0];
    console.log();
    //Clear the tooltip and update it's contents
    tooltip.selectAll("p").remove();

    // Fill the body of the tooltip with the appropriate text
    tooltip.append("p").text(`Name: ${elementData.data.name}`);
    tooltip.append("p").text(`Category: ${elementData.data.category}`);
    tooltip.append("p").text(`Value: ${elementData.data.value}`);

    //     //Add the data-value attr for the tests
    tooltip.attr("data-value", elementData.data.value);

    //Dynamically setting the tooltip border color depending on the square
    tooltip.style(
      "border-color",
      fadeColor(e.path[1].firstChild.getAttribute("fill"))
    );

    // Place the tooltip in its positon
    tooltip
      .style("left", e.pageX + 15 + "px")
      .style("top", e.pageY - 20 + "px");
  };
  cellTextContainers
    .on("mouseover", mouseoverTooltip)
    .on("mouseleave", mouseleaveTooltip)
    .on("mousemove", mousemoveTooltip);
  // cellTexts
  //   .on("mouseover", mouseoverTooltip)
  //   .on("mouseleave", mouseleaveTooltip)
  //   .on("mousemove", mousemoveTooltip);
  squares
    .on("mouseover", mouseoverTooltip)
    .on("mouseleave", mouseleaveTooltip)
    .on("mousemove", mousemoveTooltip);
});
