# -*- coding: utf-8 -*-
"""
Created on Fri Oct  2 15:19:46 2020

@author: sookmyung
"""

import csv, sys, time

import pandas as pd
start_time = time.time()

from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "wowhi223"), encrypted=False)

'''
    name : 이상우
    pid : 880514-1520414
'''

def extractCreateProps(p, d, ac):

    userNames, userIds = [], []
    dataNames, dataFilePaths, dataVals, dataOrigins = [], [], [], []
    acNames, acDates, acDetails = [], [], []
    
    for idx, val in enumerate(d):
        userNames.append(p[idx]['name'])
        userIds.append(p[idx]['pid'])
        
        dataNames.append(d[idx]['name'])
        dataFilePaths.append(d[idx]['file_path'])
        dataVals.append(d[idx]['value'])
        dataOrigins.append(d[idx]['origin'])
        
        acNames.append('생성')
        acDates.append(ac[idx]['date'])
        acDetails.append(ac[idx]['detail'])
        
        data = {
                #'이름': userNames,
                #'ID' : userIds,
                '데이터명' : dataNames,
                '값' : dataVals,
                '파일': dataFilePaths,
                '발급처' : dataOrigins,
                '생성날짜' : acDates,
                '기타정보' : acDetails,
                }    
        
        createDF = pd.DataFrame(data, index=range(1,len(acDates)+1))
    return createDF

def extractProcessProps(p, d2, ac, d1):

    userNames, userIds = [], []
    dataNames1, dataFilePaths1, dataVals1, dataOrigins1 = [], [], [], []
    dataNames2, dataFilePaths2, dataVals2, dataOrigins2 = [], [], [], []
    acNames, acDates, acDetails = [], [], []
    
    for idx, val in enumerate(d1):
        userNames.append(p[idx]['name'])
        userIds.append(p[idx]['pid'])
        
        dataNames1.append(d1[idx]['name'])
        dataFilePaths1.append(d1[idx]['file_path'])
        dataVals1.append(d1[idx]['value'])
        dataOrigins1.append(d1[idx]['origin'])
        
        dataNames2.append(d2[idx]['name'])
        dataFilePaths2.append(d2[idx]['file_path'])
        dataVals2.append(d2[idx]['value'])
        dataOrigins2.append(d2[idx]['origin'])
        
        acNames.append('->')
        acDates.append(ac[idx]['date'])
        acDetails.append(ac[idx]['detail'])
        
        data = {
                #'이름': userNames,
                #'ID' : userIds,
                '데이터명' : dataNames1,
                '값' : dataVals1,
                '파일': dataFilePaths1,
                '발급처' : dataOrigins1,
                '가공날짜' : acDates,
                '기타정보' : acDetails,
                '(가공)' : acNames,
                '데이터명 ' : dataNames2,
                '값 ' : dataVals2,
                '파일 ': dataFilePaths2,
                '발급처 ' : dataOrigins2,
                }    
        
        processDF = pd.DataFrame(data, index=range(1,len(acDates)+1))
    return processDF

def extractProvideProps(p1, d, ac, r, p2):

    userNames, userIds = [], []
    dataNames, dataFilePaths, dataVals, dataOrigins = [], [], [], []
    rNames = []
    prices, APFroms, APTos, isAgrees = [], [], [], [] 
    acNames, acDates, acDetails = [], [], []
    APPeriods = [] 
    
    for idx, val in enumerate(d):
        userNames.append(p1[idx]['name'])
        userIds.append(p1[idx]['pid'])
        
        rNames.append(p2[idx]['name'])
        
        dataNames.append(d[idx]['name'])
        dataFilePaths.append(d[idx]['file_path'])
        dataVals.append(d[idx]['value'])
        dataOrigins.append(d[idx]['origin'])
        
        prices.append(r[idx]['price'])
        APPeriods.append(str(r[idx]['allowed_period_from']) + '~' + str(r[idx]['allowed_period_to']))
        APFroms.append(r[idx]['allowed_period_from'])
        APTos.append(r[idx]['allowed_period_to'])
        isAgrees.append(r[idx]['is_agreed'])
        
        acNames.append('제공')
        acDates.append(ac[idx]['date'])
        acDetails.append(ac[idx]['detail'])
        
        data = {#'이름': userNames,
                #'ID' : userIds,
                '데이터명' : dataNames,
                '값' : dataVals,
                '파일': dataFilePaths,
                '발급처' : dataOrigins,
                '제공날짜' : acDates,
                '제공기관' : rNames,
                '가격' : prices,
                '정보제공 동의여부' : isAgrees,
                '기타정보' : acDetails,
                '제공허용기간' : APPeriods,
                } 
        
        provideDF = pd.DataFrame(data, index=range(1,len(acDates)+1))
    return provideDF

    
def searchCreateProv(tx, dateFlag):
    createCypher = ("MATCH (d:Data)-[:Generate]-(ac:Activity)-[:Act]-(p:Person) "
                    "WHERE ac.name = '생성' AND ")
    returnCypher = ("p.name = '" + user_name + "' AND p.pid = '"+ user_pid +"' "
                    "RETURN p, d, ac")
    if dateFlag:
        createCypher = (createCypher
                        + "(ac.date >= '" + datesArgvs[0] + "' AND ac.date <= '" + datesArgvs[1] + "') AND "
                        + returnCypher)
    else:
        createCypher = createCypher + returnCypher

    results = tx.run(createCypher).values()
    
    p, d, ac = [], [], []
    for result in results:
        p.append(result[0])
        d.append(result[1])
        ac.append(result[2])
        
    createDF = extractCreateProps(p, d, ac)
    
    return createDF


def searchProcessProv(tx, dateFlag):
    processCypher = ("MATCH (d2:Data)<-[:Generate]-(ac:Activity)<-[:Generate]-(d1:Data), "
                     "(ac:Activity)-[:Act]-(p:Person) "
                     "WHERE ac.name = '가공' AND ")
    returnCypher = ("p.name = '" + user_name + "' AND p.pid = '"+ user_pid +"' "
                    "RETURN p, d2, ac, d1 ")
    
    if dateFlag:
        processCypher = (processCypher
                        + "(ac.date >= '" + datesArgvs[0] + "' AND ac.date <= '" + datesArgvs[1] + "') AND "
                        + returnCypher)
    else:
        processCypher = processCypher + returnCypher
        
    results = tx.run(processCypher).values()
    
    p, d2, ac, d1 = [], [], [], []
    for result in results:
        p.append(result[0])
        d2.append(result[1])
        ac.append(result[2])
        d1.append(result[3])
        
    processDF = extractProcessProps(p, d2, ac, d1)
    
    return processDF


def searchProvideProv(tx, dateFlag):
    provideCypher = ("MATCH (d:Data)-[:Generate]-(ac:Activity)-[s:Send]-(p1:Person), "
                     "(ac:Activity)-[r:Receive]-(p2:Person) "
                     "WHERE ac.name = '제공' AND ")
    returnCypher = ("p1.name = '" + user_name + "' AND p1.pid = '"+ user_pid +"' "
                    "RETURN p1, d, ac, r, p2 ")
    if dateFlag:
        provideCypher = (provideCypher
                        + "(ac.date >= '" + datesArgvs[0] + "' AND ac.date <= '" + datesArgvs[1] + "') AND "
                        + returnCypher)
    else:
        provideCypher = provideCypher + returnCypher
        
    results = tx.run(provideCypher).values()
    
    p1, d, ac, r, p2 = [], [], [], [], []
    for result in results:
        p1.append(result[0])
        d.append(result[1])
        ac.append(result[2])
        r.append(result[3])
        p2.append(result[4])
        
    provideDF = extractProvideProps(p1, d, ac, r, p2)

    return provideDF
        

user_name = sys.argv[1]
user_pid = sys.argv[2]

filename = user_name + '(' + user_pid +')님의 이력데이터.xlsx'
writer = pd.ExcelWriter(filename, engine='xlsxwriter')

dateFlag = sys.argv[3]
actFlag = sys.argv[4]

datesArgvs = sys.argv[5]
actArgvs = sys.argv[6]

datesArgvs = datesArgvs.split(',')
actArgvs = actArgvs.split(',')

with driver.session() as session:

    
    if actFlag and dateFlag:
        for act in actArgvs:
            if act == '생성':
                createDF = session.read_transaction(searchCreateProv, dateFlag)
                createDF.to_excel(writer, sheet_name='생성')
            elif act == '가공':
                processDF = session.read_transaction(searchProcessProv, dateFlag)   
                processDF.to_excel(writer, sheet_name='가공')
            elif act == '제공':
                provideDF = session.read_transaction(searchProvideProv, dateFlag)   
                provideDF.to_excel(writer, sheet_name='제공')
    else:
        if actFlag: 
            for act in actArgvs:
                if act == '생성':
                    createDF = session.read_transaction(searchCreateProv, dateFlag)
                    createDF.to_excel(writer, sheet_name='생성')
                elif act == '가공':
                    processDF = session.read_transaction(searchProcessProv, dateFlag)   
                    processDF.to_excel(writer, sheet_name='가공')
                elif act == '제공':
                    provideDF = session.read_transaction(searchProvideProv, dateFlag)   
                    provideDF.to_excel(writer, sheet_name='제공')
        elif dateFlag:
            createDF = session.read_transaction(searchCreateProv, dateFlag)
            processDF = session.read_transaction(searchProcessProv, dateFlag) 
            provideDF = session.read_transaction(searchProvideProv, dateFlag)


    writer.save()


