# -*- coding: utf-8 -*-
"""
Created on Mon Dec  2 11:17:32 2019

@author: SookmyungWomensUniv
"""

import csv    

csv.register_dialect(
    'mydialect',
    delimiter = ',',
    quotechar = '"',
    doublequote = True,
    skipinitialspace = True,
    lineterminator = '\r\n',
    quoting = csv.QUOTE_MINIMAL)

with open("LargeData.csv",'r') as f:
    f1 = list(csv.reader(f,delimiter=","))


wlist = []
for i in range(100):
    wlist.append(f1[i])


f = open('output.csv', 'w', encoding='euc-kr', newline='')

wr = csv.writer(f)
wr.writerow(f1[0])


f.close()


   