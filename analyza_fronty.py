# script na analyzu fronty. pro dane datum zjisti, jestli je studena fronta (teplou ignoruju) alespon ve dvou gridovych bodech vedle sebe. pokud ano, udela prumer vektoru rychlosti a smeru fronty.
# potom z bodu fronty a bodu s nimi sousedicimi ziska maximalni hodnotu gradT. vystup je tabulka ve formatu "datetime   smer    rychlost    maxGradt"
# pokud je v dany datetime vic jak jedna SF, do vystupu jde ta s vyssi hodnotou maxGradT
# WIP

import polars as pl
from icecream import ic
import datetime
import math

DATETIME_COLUMN_NAME = 'Datum_[rrrrmmddHH]'
POINTS = [(10.0, 47.0), (10.0, 48.5), (10.0, 50.0), (10.0, 51.5), (10.0, 53.0), (11.5, 47.0), (11.5, 48.5), (11.5, 50.0), (11.5, 51.5), (11.5, 53.0), (13.0, 47.0), (13.0, 48.5), (13.0, 50.0), (13.0, 51.5), (13.0, 53.0), (14.5, 47.0), (14.5, 48.5), (14.5, 50.0), (14.5, 51.5), (14.5, 53.0), (16.0, 47.0), (16.0, 48.5), (16.0, 50.0), (16.0, 51.5), (16.0, 53.0), (17.5, 47.0), (17.5, 48.5), (17.5, 50.0), (17.5, 51.5), (17.5, 53.0), (19.0, 47.0), (19.0, 48.5), (19.0, 50.0), (19.0, 51.5), (19.0, 53.0)]
HEADER = 'datetime,v_mer,v_zon,v,max_gradT (station)'

# funkce pro ziskani dict z radku zacinajiciho danym datetimem
def get_row_dict(dt, df):
    dt = int(dt)
    row = df.filter(pl.col(DATETIME_COLUMN_NAME)==dt)
    if row.is_empty(): return None
    row_dict = row.to_dict(as_series=False)
    row_dict.pop(DATETIME_COLUMN_NAME, None)
    row_dict = {key: row_dict[key][0] for key in row_dict}
    row_dict = {tuple(key.replace('[', '').replace(']', '').split(';')): value for key, value in row_dict.items()} # prevede points na format (str, str)
    row_dict = {(float(key[0]), float(key[1])): value for key, value in row_dict.items()} # prevede points na format (float, float) (stejny jako je v const POINTS)
    return row_dict

def get_adjacent_points(point: tuple[float, float], all_points: list = POINTS):
    for point2 in all_points:
        if point2 == point: continue
        distance = (point[0]-point2[0])**2 + (point[1]-point2[1])**2
        if distance <= 4.5: # body jsou od sebe 1.5 vzdalene, takze sousedici body jsou vzdalene max 2*1.5^2=4 od sebe 
            yield point2

# funkce na nalezeni vsech studenych front v datech. fronty se skladaji z bodu, ktere jsou tesne u sebe a maji hodnotu -1
def find_fronts(row_dict) -> list[list[tuple]]:
    def find_front_points(point, front_points=[]): # funkce pro rekurzivni hledani front
        for point2 in get_adjacent_points(point):
            if point2 in front_points: continue
            if row_dict[point2] == -1:
                front_points.append(point2)
                front_points = find_front_points(point2, front_points=front_points)
        return front_points
    fronts = []
    all_front_points = set() # set vsech bodu co jsou soucasti nejaky fronty
    for point, value in row_dict.items():
        if value != -1: continue # zajimaji me jenom studene fronty a ty jsou oznacene hodnotou -1
        if point in all_front_points: continue
        front_points = find_front_points(point, front_points=[]) # z nejakyho duvodu se to posere kdyz sem nedam front_points=[]
        all_front_points.update(front_points)
        if len(front_points) >= 2 and front_points not in fronts:
            fronts.append(front_points)
    return fronts

def calculate_front_vector(row_dict_mer, row_dict_zon, front: list[tuple]):
    mer_v_list = [] # list mer rychlosti vsech bodu
    zon_v_list = []

    for point, value in row_dict_mer.items():
        if point not in front: continue
        mer_v_list.append(value)
    for point, value in row_dict_zon.items():
        if point not in front: continue
        zon_v_list.append(value)
    
    return sum(mer_v_list)/len(mer_v_list), sum(zon_v_list)/len(zon_v_list)

# funkce na nalezeni maximalniho gradT v bodech fronty a bodech v sousednich bodech
def find_max_grad_t(row_dict_grad_t, front) -> tuple[tuple, float]:
    grad_t_list = [] # list gradT hodnot ve formatu [(stanice, hodnota)]
    for point, value in row_dict_grad_t.items():
        if point not in front: continue
        grad_t_list.append((point, value))
        for point2 in get_adjacent_points(point):
            value = row_dict_grad_t[point2]
            grad_t_list.append((point2, value))
    grad_t_list = sorted(grad_t_list, key=lambda x: x[1], reverse=True)
    return grad_t_list[0]

def generate_datetimes(year):
    start_date = datetime.datetime(year, 1, 1, 0)
    datetimes_list = []
    current_date = start_date
    end_date = datetime.datetime(year+1, 1, 1, 0)
    while current_date < end_date:
        formatted_date = current_date.strftime('%Y%m%d%H')
        datetimes_list.append(formatted_date)
        current_date += datetime.timedelta(hours=12)
    return datetimes_list

def main():
    front_df = pl.read_csv('data/fronta.csv')
    mer_df, zon_df = pl.read_csv('data/vMer.csv'), pl.read_csv('data/vZon.csv')
    grad_t_df = pl.read_csv('data/gradT.csv')

    with open('analyza_fronty_2023.csv', 'w') as f:
        f.write(HEADER)
        f.write('\n')
        for dt in generate_datetimes(2023):
            row_dict_front = get_row_dict(dt, front_df)
            row_dict_mer, row_dict_zon = get_row_dict(dt, mer_df), get_row_dict(dt, zon_df)
            row_dict_grad_t = get_row_dict(dt, grad_t_df)
            if not row_dict_front or not row_dict_mer or not row_dict_zon or not row_dict_grad_t: continue
            fronts = find_fronts(row_dict_front)
            if not fronts: continue
            fronts = sorted(fronts, key=lambda front: find_max_grad_t(row_dict_grad_t, front)[1], reverse=True) # seradim je podle nejvyssi hodnoty gradT
            for front in fronts:
                max_grad_t = find_max_grad_t(row_dict_grad_t, front)
                front_vector = calculate_front_vector(row_dict_mer, row_dict_zon, front)
                speed = math.sqrt(front_vector[0]**2 + front_vector[1]**2)
                f.write(f'{dt},')
                f.write(f'{round(front_vector[0], 2)},{round(front_vector[1], 2)},')
                f.write(f'{round(speed, 2)},')
                f.write(f'{str(round(max_grad_t[1], 2)).ljust(4, '0')} ({max_grad_t[0][0]};{max_grad_t[0][1]})\n')

if __name__ == '__main__':
    main()