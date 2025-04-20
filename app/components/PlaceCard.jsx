// components/PlaceCard.js
export default function PlaceCard({ imageSrc, name }) {
    return (
        <div className="relative overflow-hidden rounded-lg shadow-md w-40 h-40 shrink-0">
            <img
                src={imageSrc}
                alt={name}
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 text-white text-center py-2">
                {name}
            </div>
        </div>
    );
}
