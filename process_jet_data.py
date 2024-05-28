# script na processovani jet dat z uchylny excel tabulky do neceho lidskyho
import polars as pl
import calendar

def days_in_month(year, month):
    try:
        days = calendar.monthrange(year, month)[1]
        return days
    except ValueError:
        return None  # Invalid month

RAW_DATA_FILENAME = 'jet_raw.csv'
YEAR = 2020
OUTPUT_FILENAME = f'jet_{YEAR}.csv'

df = pl.read_csv(RAW_DATA_FILENAME)
row = df.filter(pl.col('year') == YEAR)
row_dict = row.to_dict(as_series=False)
row_dict.pop('year', None)
row_dict = {key: row_dict[key][0] for key in row_dict}

result_data = {} # vysledny data ve formatu datetime: value

current_day = 1
current_hour = 0
current_month = 6
for key, value in row_dict.items():
    month = str(current_month).zfill(2)
    day = str(current_day).zfill(2)
    hour = str(current_hour).zfill(2)
    dt = f'{YEAR}{month}{day}{hour}'
    if current_hour == 12:
        current_hour = 0
        current_day += 1
        if current_day > days_in_month(YEAR, current_month):
            current_day = 1
            current_month += 1
    else: current_hour = 12
    result_data[dt] = value

with open(OUTPUT_FILENAME, 'w') as f:
    for dt, value in result_data.items():
        f.write(f'{dt};{value}\n')