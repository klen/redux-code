require("nvim-test").setup {
  runners = {
    typescript = "nvim-test.runners.jest",
  },
}

require("runner").setup {
  languages = {
    typescript = "./node_modules/.bin/ts-node",
  },
}
