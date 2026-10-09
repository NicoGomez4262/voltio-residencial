-DVOLTIO_FIX_GPIO_HELTEC=1
"-DGPIO_IS_VALID_GPIO(gpio_num)=((gpio_num >= 0) && (((1ULL << (gpio_num)) & SOC_GPIO_VALID_GPIO_MASK) != 0))"
"-DGPIO_IS_VALID_OUTPUT_GPIO(gpio_num)=((gpio_num >= 0) && (((1ULL << (gpio_num)) & SOC_GPIO_VALID_OUTPUT_GPIO_MASK) != 0))"
"-DGPIO_IS_VALID_DIGITAL_IO_PAD(gpio_num)=((gpio_num >= 0) && (((1ULL << (gpio_num)) & SOC_GPIO_VALID_DIGITAL_IO_PAD_MASK) != 0))"
