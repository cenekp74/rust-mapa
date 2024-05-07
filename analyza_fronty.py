# script na analyzu fronty. pro dane datum zjisti, jestli je studena fronta (teplou ignoruju) alespon ve dvou gridovych bodech vedle sebe. pokud ano, udela vektorovy soucet rychlosti a smeru fronty.
# potom z bodu fronty a bodu s nimi sousedicimi ziska maximalni hodnotu gradT. vystup je tabulka ve formatu "datetime   smer    rychlost    maxGradt"
# pokud je v dany datetime vic jak jedna SF, do vystupu jde ta s vyssi hodnotou maxGradT
# WIP

import polars as pl
from icecream import ic

DATETIME_COLUMN_NAME = 'Datum_[rrrrmmddHH]'
POINTS = [(10.0, 47.0), (10.0, 48.5), (10.0, 50.0), (10.0, 51.5), (10.0, 53.0), (11.5, 47.0), (11.5, 48.5), (11.5, 50.0), (11.5, 51.5), (11.5, 53.0), (13.0, 47.0), (13.0, 48.5), (13.0, 50.0), (13.0, 51.5), (13.0, 53.0), (14.5, 47.0), (14.5, 48.5), (14.5, 50.0), (14.5, 51.5), (14.5, 53.0), (16.0, 47.0), (16.0, 48.5), (16.0, 50.0), (16.0, 51.5), (16.0, 53.0), (17.5, 47.0), (17.5, 48.5), (17.5, 50.0), (17.5, 51.5), (17.5, 53.0), (19.0, 47.0), (19.0, 48.5), (19.0, 50.0), (19.0, 51.5), (19.0, 53.0)]

# funkce pro ziskani dict z radku zacinajiciho danym datetimem
def get_row_dict(datetime, df):
    datetime = int(datetime)
    row = df.filter(pl.col(DATETIME_COLUMN_NAME)==datetime)
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
        front_points = find_front_points(point)
        all_front_points.update(front_points)
        if len(front_points) > 2:
            fronts.append(front_points)
    return fronts

def main():
    datetime = 2023081500
    front_df = pl.read_csv('data/fronta.csv')
    row_dict = get_row_dict(datetime, front_df)

    ic(find_fronts(row_dict))

if __name__ == '__main__':
    main()