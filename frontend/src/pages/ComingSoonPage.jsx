import BottomNav from "../components/BottomNav";

function ComingSoonPage({ title }) {
  return (
    <div className="page">
      <div className="page__content page__content--centered">
        <p className="coming-soon">{title} — coming soon</p>
      </div>
      <BottomNav />
    </div>
  );
}

export default ComingSoonPage;