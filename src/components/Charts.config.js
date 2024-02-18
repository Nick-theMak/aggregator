import { Tooltip } from "react-bootstrap"

export const options = {
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    },
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
      autoSelected: 'zoom',
    },
    background: '#1a2a1a',
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'straight',
    colors: ['#2e8b57'], // Line color
  },
  title: {
    text: 'Reserve History',
    align: 'left',
    style: {
      color: '#ffffff',
    },
  },
  grid: {
    row: {
      colors: ['#1a2a1a', 'transparent'], // Alternating row background colors
      opacity: 0.5,
    },

  },
  xaxis: {
    labels: {
      style: {
        colors: '#ffffff', // X-axis labels
      },
    },
    axisBorder: {
      color: '#2e8b57',
    },
    axisTicks: {
      color: '#2e8b57',
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#ffffff', // Y-axis labels
      },
    },
  },
  markers: {
    colors: ['#006400', '#2e8b57'], // Data point colors
  },
  tooltip: {
    theme: 'dark',
    style: {
      backgroundColor: '#1a2a1a',
      borderColor: '#2e8b57',
    },
  },
  theme: {
    mode: 'dark',
    palette: 'palette1', // Define your own palette or use existing ones
  },
}



// Code in the series as a temporary placeholder for demonstration
export const series = [{
  data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
}]
