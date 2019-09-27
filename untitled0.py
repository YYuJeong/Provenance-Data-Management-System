# -*- coding: utf-8 -*-
"""
Created on Wed Sep 11 14:03:21 2019

@author: YuJeong
"""

# _*_ coding: utf-8 _*_

import bottlenose
from bs4 import BeautifulSoup
import html5lib

AWS_ACCESS_KEY_ID = "AKIA2HW3GH7JM3EFBMKB"
AWS_SECRET_ACCESS_KEY = "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"
AWS_ASSOCIATE_TAG = "diddbwjd96-20"

amazon = bottlenose.Amazon(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ASSOCIATE_TAG)
page = 1

for page in range(1, 3):
    response = amazon.ItemSearch(Keywords="coke", SearchIndex="All", MaxQPS=0.7, ItemPage=page)
    result = BeautifulSoup(response, "html5lib")

    for item in result.findAll("item"):
        print(item.asin.string)