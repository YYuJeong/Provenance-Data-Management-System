# -*- coding: utf-8 -*-
"""
Created on Mon Dec  2 11:17:32 2019

@author: SookmyungWomensUniv
"""

import csv, random    

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
    
'''
소유자	소유자소속	데이터	가격	데이터종류	수집장치	행동	날짜
	행위자	행위자소속	데이터	가격	데이터종류	수집장치

생성 /수정 가공 변환 1250/ 배포 판매 전달 1250
'''
actTmp = ['생성', '생성', '수정', '가공', '변환', '배포', '판매', '전달']
wlist = []
for i in range(10000):
    wlist.append([])

for j in range(10000):
    for i in range(6):
        wlist[j].append(f1[j][i])

for j in range(8):
    for i in range(1250):
        wlist[i+(1250*j)].append(actTmp[j])
        
for j in range(10000):
    wlist[j].append(f1[j][7])
    
    
nameTmp = []
affTmp = []

dataTmp = []
priceTmp = []
deviceTmp = []
typeTmp = []

for i in range(10000):
    nameTmp.append(f1[i][0])
    affTmp.append(f1[i][1])
    dataTmp.append(f1[i][2])
    priceTmp.append(f1[i][3])
    typeTmp.append(f1[i][4])
    deviceTmp.append(f1[i][5])


random.shuffle(nameTmp)
random.shuffle(affTmp) 
random.shuffle(dataTmp)
random.shuffle(priceTmp)
random.shuffle(typeTmp)
random.shuffle(deviceTmp) 
    
for i in range(2500, 10000):
    wlist[i].append(nameTmp[i])
    wlist[i].append(affTmp[i])    

for i in range(2500, 10000):
    if wlist[i][6] == '수정':
        wlist[i].append(dataTmp[i])
        wlist[i].append(priceTmp[i])
        wlist[i].append(typeTmp[i])
        wlist[i].append(deviceTmp[i])
    elif wlist[i][6] == '변환':
        wlist[i].append(dataTmp[i])
        wlist[i].append(priceTmp[i])
        wlist[i].append(typeTmp[i])
        wlist[i].append(deviceTmp[i])
    elif wlist[i][6] == '가공':
        wlist[i].append(dataTmp[i])
        wlist[i].append(priceTmp[i])
        wlist[i].append(typeTmp[i])
        wlist[i].append(deviceTmp[i])
        
random.shuffle(wlist)        
f = open('output.csv', 'w', encoding='euc-kr', newline='')
wr = csv.writer(f)
for i in range(10000):
    wr.writerow(wlist[i])


f.close()


   