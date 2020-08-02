class Resource {
  constructor(name, value, show=false) {
    this.name = name
    this.value = value
    this.show = show
    this.amount = 0
    this.permanent = 0
  }
}

export function init_resources() {
  return {
    'sp': new Resource('🌰',1,true),
    'figs': new Resource('🍊',2,true),
    'worms': new Resource('🐛',5,true),
  }
}
