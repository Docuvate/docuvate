//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dashboard_widget_dto_class.g.dart';

/// DashboardWidgetDtoClass
///
/// Properties:
/// * [id] 
/// * [type] 
/// * [position] 
/// * [widthCols] 
/// * [heightRows] 
/// * [savedViewId] 
/// * [itemLimit] 
@BuiltValue()
abstract class DashboardWidgetDtoClass implements Built<DashboardWidgetDtoClass, DashboardWidgetDtoClassBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  DashboardWidgetDtoClassTypeEnum get type;
  // enum typeEnum {  saved_view,  upload,  statistics,  recent_documents,  attention,  };

  @BuiltValueField(wireName: r'position')
  num get position;

  @BuiltValueField(wireName: r'widthCols')
  num get widthCols;

  @BuiltValueField(wireName: r'heightRows')
  num get heightRows;

  @BuiltValueField(wireName: r'savedViewId')
  String? get savedViewId;

  @BuiltValueField(wireName: r'itemLimit')
  num? get itemLimit;

  DashboardWidgetDtoClass._();

  factory DashboardWidgetDtoClass([void updates(DashboardWidgetDtoClassBuilder b)]) = _$DashboardWidgetDtoClass;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DashboardWidgetDtoClassBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DashboardWidgetDtoClass> get serializer => _$DashboardWidgetDtoClassSerializer();
}

class _$DashboardWidgetDtoClassSerializer implements PrimitiveSerializer<DashboardWidgetDtoClass> {
  @override
  final Iterable<Type> types = const [DashboardWidgetDtoClass, _$DashboardWidgetDtoClass];

  @override
  final String wireName = r'DashboardWidgetDtoClass';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DashboardWidgetDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(DashboardWidgetDtoClassTypeEnum),
    );
    yield r'position';
    yield serializers.serialize(
      object.position,
      specifiedType: const FullType(num),
    );
    yield r'widthCols';
    yield serializers.serialize(
      object.widthCols,
      specifiedType: const FullType(num),
    );
    yield r'heightRows';
    yield serializers.serialize(
      object.heightRows,
      specifiedType: const FullType(num),
    );
    if (object.savedViewId != null) {
      yield r'savedViewId';
      yield serializers.serialize(
        object.savedViewId,
        specifiedType: const FullType(String),
      );
    }
    if (object.itemLimit != null) {
      yield r'itemLimit';
      yield serializers.serialize(
        object.itemLimit,
        specifiedType: const FullType(num),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DashboardWidgetDtoClass object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DashboardWidgetDtoClassBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DashboardWidgetDtoClassTypeEnum),
          ) as DashboardWidgetDtoClassTypeEnum;
          result.type = valueDes;
          break;
        case r'position':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.position = valueDes;
          break;
        case r'widthCols':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.widthCols = valueDes;
          break;
        case r'heightRows':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.heightRows = valueDes;
          break;
        case r'savedViewId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.savedViewId = valueDes;
          break;
        case r'itemLimit':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.itemLimit = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DashboardWidgetDtoClass deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DashboardWidgetDtoClassBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class DashboardWidgetDtoClassTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'saved_view')
  static const DashboardWidgetDtoClassTypeEnum savedView = _$dashboardWidgetDtoClassTypeEnum_savedView;
  @BuiltValueEnumConst(wireName: r'upload')
  static const DashboardWidgetDtoClassTypeEnum upload = _$dashboardWidgetDtoClassTypeEnum_upload;
  @BuiltValueEnumConst(wireName: r'statistics')
  static const DashboardWidgetDtoClassTypeEnum statistics = _$dashboardWidgetDtoClassTypeEnum_statistics;
  @BuiltValueEnumConst(wireName: r'recent_documents')
  static const DashboardWidgetDtoClassTypeEnum recentDocuments = _$dashboardWidgetDtoClassTypeEnum_recentDocuments;
  @BuiltValueEnumConst(wireName: r'attention')
  static const DashboardWidgetDtoClassTypeEnum attention = _$dashboardWidgetDtoClassTypeEnum_attention;

  static Serializer<DashboardWidgetDtoClassTypeEnum> get serializer => _$dashboardWidgetDtoClassTypeEnumSerializer;

  const DashboardWidgetDtoClassTypeEnum._(String name): super(name);

  static BuiltSet<DashboardWidgetDtoClassTypeEnum> get values => _$dashboardWidgetDtoClassTypeEnumValues;
  static DashboardWidgetDtoClassTypeEnum valueOf(String name) => _$dashboardWidgetDtoClassTypeEnumValueOf(name);
}

