// impliedVolatilityUtils.js

// Helper function for cumulative distribution function (CDF) of standard normal distribution
function normCDF(x) {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * x);
  const y = (((a5 * t + a4) * t + a3) * t + a2) * t + a1;

  const cdf = 0.5 * (1.0 + sign * y);
  return cdf;
}

// Black-Scholes formula for implied volatility calculation
function calculateBSPrice(
  volatility,
  underlyingPrice,
  strikePrice,
  riskFreeRate,
  timeToMaturity,
  optionType
) {
  const d1 =
    (Math.log(underlyingPrice / strikePrice) +
      (riskFreeRate + (volatility * volatility) / 2) * timeToMaturity) /
    (volatility * Math.sqrt(timeToMaturity));
  const d2 = d1 - volatility * Math.sqrt(timeToMaturity);
  const callPrice =
    underlyingPrice * Math.exp(-riskFreeRate * timeToMaturity) * normCDF(d1) -
    strikePrice * Math.exp(-riskFreeRate * timeToMaturity) * normCDF(d2);
  const putPrice =
    callPrice -
    underlyingPrice +
    strikePrice * Math.exp(-riskFreeRate * timeToMaturity);
  return optionType === "CE" ? callPrice : putPrice;
}

// Newton-Raphson method for solving implied volatility
export function calculateImpliedVolatility(
  data,
  optionPrice,
  underlyingPrice,
  riskFreeRate,
  timeToMaturity
) {
  let minVolatility = 0;
  let maxVolatility = 10; // Adjust the maximum volatility as needed
  let tolerance = 0.0001; // Adjust the tolerance as needed

  let iteration = 0;
  let midVolatility, bsPrice;

  while (maxVolatility - minVolatility > tolerance) {
    iteration++;
    if (iteration > 1000) {
      console.log("Max iterations reached. No convergence.");
      return null;
    }

    midVolatility = (minVolatility + maxVolatility) / 2;
    bsPrice = calculateBSPrice(midVolatility);

    if (Math.abs(bsPrice - optionPrice) < tolerance) {
      return midVolatility;
    }

    if (bsPrice > optionPrice) {
      maxVolatility = midVolatility;
    } else {
      minVolatility = midVolatility;
    }
  }

  return midVolatility;
}

// Helper function to extract the optionType from the option symbol
export function getOptionType(symbol)
{
  return symbol.split(/(\d+)/)[4];
}

// export function getOptionPrice(data)
// {
//   const optionPrice=data.LTP;
//   return optionPrice;
// }

// Helper function to extract the expiry date and time from the option symbol
export function getExpiryDateTime(optionSymbol) {
  // Regular expression pattern to match the date portion
  const pattern = /\d{2}[A-Z]{3}\d{2}/;
  const expiryDateStr = optionSymbol.match(pattern);
  const expiryTime = "15:30"; // Expiry time in IST
  const expiryDateTimeStr = expiryDateStr + " " + expiryTime + " GMT+0530";
  return new Date(expiryDateTimeStr);
}

// Helper function to get the underlying price based on the symbol
export function getUnderlyingPrice(symbol) {
  const underlyingSymbol = symbol.split(/(\d+)/)[0]; // Extract the underlying symbol
  const underlyingPrices = {
    MAINIDX: 1854880,
    FINANCIALS: 1940360,
    ALLBANKS: 4398250,
    MIDCAPS: 785650,
  };
  return underlyingPrices[underlyingSymbol];
}

// Helper function to calculate the time to maturity
export function calculateTimeToMaturity(currentDate, expiryDate) {
  const expiryTime = "15:30"; // Expiry time in IST
  const expiryDateTime = new Date(
    expiryDate.toDateString() + " " + expiryTime + " GMT+0530"
  );

  // Calculate the time difference in milliseconds
  const timeDiff = expiryDateTime.getTime() - currentDate.getTime();

  // Convert milliseconds to days
  const daysToMaturity = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return daysToMaturity;
}
