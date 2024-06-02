import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator
from matplotlib.colors import BoundaryNorm
import numpy as np
import polars as pl

# nejakej odpornej kod na generovani grafu vetrny ruzice, komplet zkopirovany ze stackoverflow 

YEAR = '2020'

def create_windrose(data_theta, data_r, data_gradt, colormap='viridis', filaname='windrose.png'):
    ftheta=50 #this is the number of subdivisions of angles in the graph
    fr=16 #this is the number of subdivision of concentric circles in the graph
    mapa=colormap #Here you can choose the colormap you prefer
    nlevel=15 #This is the subdivisions of color and it depens of the values of pm array

    eliminar=[]
    for i in range(len(data_gradt)):
        if np.isnan(data_gradt[i]) or np.isnan(data_r[i]) or np.isnan(data_theta[i]):
            eliminar.append(i)
    data_gradt=np.delete(data_gradt,eliminar)
    data_r=np.delete(data_r,eliminar)
    data_theta=np.delete(data_theta,eliminar)

    theta = np.linspace(0,2*np.pi,ftheta)
    r = np.linspace(min(data_r),max(data_r),fr)

    Theta, R = np.meshgrid(theta, r)

    dr=(r[1]-r[0])/2
    dtheta=(theta[1]-theta[0])/2

    C_pm=R*0

    for i in range(len(Theta)):
        for j in range(len(Theta[0])):
            cantidad=0
            suma=0
            for dato in range(len(data_gradt)):
                if data_r[dato]<=(R[i][j]+dr) and data_r[dato]>(R[i][j]-dr) and data_theta[dato]<=(Theta[i][j]+dtheta) and data_theta[dato]>(Theta[i][j]-dtheta):
                    suma=suma+data_gradt[dato]
                    cantidad=cantidad+1
            if cantidad!=0:
                promedio=suma/cantidad
            else:
                promedio=0
            C_pm[i][j]=promedio

    levels = MaxNLocator(nbins=nlevel).tick_values(C_pm.min(), C_pm.max())
    cmap = plt.get_cmap(mapa)
    norm = BoundaryNorm(levels, ncolors=cmap.N, clip=True)

    C_pm = np.ma.masked_less_equal(C_pm,0.05)

    fig, ax = plt.subplots(subplot_kw={"projection":"polar"})

    im=ax.pcolormesh(Theta, R, C_pm, cmap=cmap)
    cbar=fig.colorbar(im, ax=ax)
    ax.set_title(f'speed of frontal boundary {YEAR}')
    ax.set_theta_direction(-1)
    ax.set_theta_offset(np.radians(90))
    ax.set_xticklabels(['N', 'NE',  'E', 'SE', 'S', 'SW','W', 'NW'])
    cbar.set_label('max grad T')
    plt.savefig(filaname)

def main():
    #FILENAMES = ['analyza_fronty_2013.csv', 'analyza_fronty_2014.csv', 'analyza_fronty_2015.csv']
    #FILENAMES = ['analyza_fronty_2018.csv', 'analyza_fronty_2019.csv', 'analyza_fronty_2020.csv']
    FILENAMES = [f'analyza_fronty_{YEAR}.csv']
    df = pl.concat([pl.read_csv(fn, dtypes={'datetime':pl.Utf8}) for fn in FILENAMES])
    for month in ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']:
        df_month = df.filter(pl.col('datetime').str.slice(4, length=2) == month)
        if df_month.is_empty(): continue
        filtered_df_tf = df_month.filter(pl.col('type') == 1)
        data_theta = list(np.radians(filtered_df_tf["dir[deg]"].to_list()))
        data_r = filtered_df_tf["v[m/s]"].to_list()
        data_gradt = [float(x.split(' ')[0]) for x in filtered_df_tf["max_gradT (station)"].to_list()]
        for index, v in enumerate(data_r): # zajimaji me jenom fronty s rychosti pres 5m/s
            if v < 5:
                del data_r[index]
                del data_gradt[index]
                del data_theta[index]
        create_windrose(data_theta, data_r, data_gradt, colormap='inferno', filaname=f'windrose/windrose_tf_{YEAR}_{month}')

        filtered_df_sf = df_month.filter(pl.col('type') == -1)
        data_theta = np.radians(filtered_df_sf["dir[deg]"].to_list())
        data_r = filtered_df_sf["v[m/s]"].to_list()
        data_gradt = [float(x.split(' ')[0]) for x in filtered_df_sf["max_gradT (station)"].to_list()]
        create_windrose(data_theta, data_r, data_gradt, filaname=f'windrose/windrose_sf_{YEAR}_{month}')

if __name__ == '__main__':
    main()