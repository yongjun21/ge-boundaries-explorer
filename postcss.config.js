const ASSETS_ENDPOINT = (process.env.APP_NODE_ENV || process.env.NODE_ENV) === 'production'
                      ? 'https://graphics.straitstimes.com/STI/STIMEDIA/Interactives/commons/fonts/'
                      : 'https://st-graphics-dev-assets.s3-ap-southeast-1.amazonaws.com/fonts/v1/'

module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-font-magician')({
      custom: {
        'SelaneFifty': {
          variants: {
            normal: {
              400: {
                url: {
                  eot: ASSETS_ENDPOINT + 'SelaneWebSTFifty.eot',
                  svg: ASSETS_ENDPOINT + 'SelaneWebSTFifty.svg',
                  ttf: ASSETS_ENDPOINT + 'SelaneWebSTFifty.ttf',
                  woff: ASSETS_ENDPOINT + 'SelaneWebSTFifty.woff'
                }
              }
            }
          }
        },
        'SelaneMinTen': {
          variants: {
            normal: {
              900: {
                url: {
                  eot: ASSETS_ENDPOINT + 'SelaneWebSTMinTen.eot',
                  ttf: ASSETS_ENDPOINT + 'SelaneWebSTMinTen.ttf',
                  woff: ASSETS_ENDPOINT + 'SelaneWebSTMinTen.woff'
                }
              }
            }
          }
        },
        'SelaneTen': {
          variants: {
            normal: {
              900: {
                url: {
                  eot: ASSETS_ENDPOINT + 'selanedeckst_ten-webfont.eot',
                  ttf: ASSETS_ENDPOINT + 'selanedeckst_ten-webfont.ttf',
                  woff: ASSETS_ENDPOINT + 'selanedeckst_ten-webfont.woff',
                  svg: ASSETS_ENDPOINT + 'selanedeckst_ten-webfont.svg'
                }
              }
            }
          }
        },
        'CuratorRegular': {
          variants: {
            normal: {
              400: {
                url: {
                  eot: ASSETS_ENDPOINT + 'curator_head_st_regular-webfont.eot',
                  ttf: ASSETS_ENDPOINT + 'curator_head_st_regular-webfont.ttf',
                  woff: ASSETS_ENDPOINT + 'curator_head_st_regular-webfont.woff',
                  svg: ASSETS_ENDPOINT + 'curator_head_st_regular-webfont.svg'
                }
              }
            }
          }
        },
        'CuratorBold': {
          variants: {
            normal: {
              700: {
                url: {
                  eot: ASSETS_ENDPOINT + 'curator_head_st_bold-webfont.eot',
                  ttf: ASSETS_ENDPOINT + 'curator_head_st_bold-webfont.ttf',
                  woff2: ASSETS_ENDPOINT + 'curator_head_st_bold-webfont.woff2',
                  woff: ASSETS_ENDPOINT + 'curator_head_st_bold-webfont.woff',
                  svg: ASSETS_ENDPOINT + 'curator_head_st_bold-webfont.svg'
                }
              }
            }
          }
        }
      }
    })
  ]
}
